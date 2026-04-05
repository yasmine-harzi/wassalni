create table users (
    id_user int primary key,
    nom varchar(50) not null,
    prenom varchar(50) not null,
    email varchar(100) unique not null,
    password varchar(255) not null,
    telephone varchar(20),
    adresse varchar(50),
    role varchar(10) not null,
    date_creation date,
    check (role in ('client','vendeur','chauffeur','admin'))
);
create table admin (
    id_admin int primary key,
    niveau_acces varchar(20),
    foreign key (id_admin) references users(id_user)
);
create table coursier (
    id_coursier int primary key,
    vehicule varchar(50),
    disponibilite varchar(20),
    foreign key (id_coursier) references users(id_user)
);
create table vendeur (
    id_vendeur int primary key,
    nom_entreprise varchar(100),
    adresse_entreprise varchar(100),
    foreign key (id_vendeur) references users(id_user)
);
create table client (
    id_client int primary key,
    type_client varchar(20),
    foreign key (id_client) references users(id_user)
);
create table colis (
    id_colis int primary key,
    description varchar(100) not null,
    poids float(6,2) not null,
    statut varchar(20),
    date_creation date,
    date_livraison date,
    id_client int not null,
    id_vendeur int not null,
    id_chauffeur int,
    check (statut in ('en attente','en cours','livré','annulé')),
    foreign key (id_client) references users(id_user),
    foreign key (id_vendeur) references users(id_user),
    foreign key (id_chauffeur) references users(id_user)
);
create table suivi_colis (
    id_suivi int primary key,
    id_colis int not null,
    latitude float(10,8) not null,
    longitude float(11,8) not null,
    date_position date,
    foreign key (id_colis) references colis(id_colis)
);
create table notifications (
    id_notification int primary key,
    message varchar(100) not null,
    date_envoi date,
    statut varchar(10),
    id_user int not null,
    id_colis int,
    check (statut in ('envoyee','lue')),
    foreign key (id_user) references users(id_user),
    foreign key (id_colis) references colis(id_colis)
);
